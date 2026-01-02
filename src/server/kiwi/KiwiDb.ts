import * as mdbc from '@server/db/MariaDbConn'
import { prepareStatus, StatusOperation } from '@lib/Operation'
import type { ProductWithClassificationName } from '@server/kiwi/Product'

// These default to the Kiwi default settings.
// Make sure to set them in the .env file for proper operation.
const kiwiDbConfig = {
    host: process.env.KIWI_DB_HOST || 'localhost',
    database: process.env.KIWI_DB_DBNAME || 'kiwi',
    user: process.env.KIWI_DB_USER || 'kiwi',
    password: process.env.KIWI_DB_PASSWORD || 'kiwi',
    port: process.env.KIWI_DB_PORT ? parseInt(process.env.KIWI_DB_PORT) : 3306
}

export async function verifyConnection() : Promise<StatusOperation> {
    const op = prepareStatus('verifyKiwiDbConnection')

    const conn = await mdbc.verify(kiwiDbConfig)
    console.log('Kiwi DB connection test result:', conn)
    if (conn) {
        op.status = true
        op.statusType = 'success'
        op.message = 'Successfully connected to Kiwi database'
    } else {
        op.message = 'Failed to connect to Kiwi database'
    }

    return op
}

export async function updateSchema() : Promise<StatusOperation> {
    const op = prepareStatus('verifyKiwiDbSchema')

    const conn = await mdbc.SinglePoolConnection.init(kiwiDbConfig)
    .catch(err => {
        op.message = 'Error connecting to MariaDB'
        console.error('Error connecting to MariaDB:', err)
        return null
    })
    if (conn === null) return op

    const check = await conn.selection(`SELECT c.COLUMN_NAME as name
        FROM information_schema.COLUMNS c 
        WHERE table_schema = 'kiwi'
        and table_name = 'management_product'`
    )
    .catch(err => {
        op.message = 'Error querying MariaDB schema'
        return null
    })
    if (check === null) {
        // Do not bother to await this.
        conn.end()
        return op
    }
    const columnNames = check.map((row:any) => row.name)
    if (columnNames.includes('script_prefix')) {
        op.status = true
        op.statusType = 'success'
        op.message = 'Database schema is up to date'
        await conn.end()
        return op
    }

    const insert = await conn.update(`ALTER TABLE management_product
        ADD COLUMN script_prefix TEXT NULL DEFAULT NULL AFTER description;`
    )
    if (insert === null) {
        op.message = 'Error updating MariaDB schema'
        await conn.end()
        return op
    }
    await conn.end()

    op.status = true
    op.statusType = 'success'
    op.message = 'Database schema updated successfully'

    return op
}

// export async function getProduct(id:number) : Promise<ProductWithClassificationName|null> {
//     const conn = await mdbc.SinglePoolConnection.init(kiwiDbConfig)
//     .catch(err => {
//         console.error('Error connecting to MariaDB:', err)
//         return null
//     })
//     if (conn === null) return null

//     // Maradb supports case sensitive column names
//     const product = await conn.selection(`SELECT 
//             mp.id
//             , mp.name
//             , mp.description
//             , mp.classification_id as classification
//             , mp.script_prefix as scriptPrefix
//             , mc.name as classificationName
//         FROM management_product mp 
//         join management_classification mc ON
// 	        mp.classification_id = mc.id
//         WHERE mp.id = ?`,
//         [id]
//     )
//     .catch(err => {
//         console.error('Error querying product:', err)
//         return null
//     })
//     await conn.end()
//     if (product === null || product.length === 0) return null
//     const camelCaseProduct: ProductWithClassificationName = {
//         id: product[0].id,
//         name: product[0].name,
//         description: product[0].description,
//         classification: product[0].classification,
//         classificationName: product[0].classificationName,
//         scriptPrefix: product[0].scriptPrefix ?? undefined
//     }
//     console.debug('Fetched product:', product[0], camelCaseProduct)
//     return camelCaseProduct
// }
