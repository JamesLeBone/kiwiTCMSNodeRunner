'use server'
/*

*/
import {
    http,
    methods,
    unAuthenticated
} from './Kiwi'
import { updateOpError, updateOpSuccess, TypedOperationResult, StatusOperation, prepareStatus } from '@lib/Operation'
import { DjangoEntity } from './Django'
import { update } from '@server/Users'

export type Product = {
    id: number
    name: string
    description: string
    classification: number
    scriptPrefix?: string
}

export type ProductWithClassificationName = Product & {
    classificationName: string
}

export type Classification = {
    id: number,
    name: string
}

export type Version = {
    id: number,
    value: string,
    product: number
}

const djangoProduct = async (p: Product) : Promise<ProductWithClassificationName> => {
    const classificationId = p.classification
    const classification = await http.getEntity<Classification>('Classification', classificationId)
    const classificationName = classification ? classification.name ?? 'Unknown' : 'Unknown'
    // console.debug(classificationId, classification, classificationName)
    
    const obj: ProductWithClassificationName = {
        ...p,
        classificationName
    }
    return obj
}

const determineClassificationId = async (classification: number|string, op: TypedOperationResult<ProductWithClassificationName>) : Promise<number|null> => {
    if (typeof classification === 'number') return classification
    if (!classification) {
        updateOpError(op, 'Classification is required')
        return null
    }
    if (typeof classification === 'string') {
        if (classification.trim().length > 64) {
            updateOpError(op, 'Classification name is too long (max 64 characters)')
            return null
        }
        if (classification.trim().length === 0) {
            updateOpError(op, 'Classification name is required')
            return null
        }
    }

    const exisitng = await fetchClassifications()
    .then( clsList => clsList.find( cls => cls.name.toLowerCase() === (classification as string).toLowerCase() ) )
    if (exisitng) {
        return exisitng.id
    }

    const createClassification = await http.callDjango('Classification.create', {values: {
        name: classification
    }})
    .then( dj => {
        const cls = dj.values as Classification
        console.debug('Created Classification', cls)
        return cls.id
    })
    .catch( e => {
        console.error('Failed to create classification', e)
        updateOpError(op, 'Failed to create classification: ' + (e.message ?? 'Unknown error'))
        return null
    } )
    return createClassification
}

export const create = async (name: string, description: string, classification: number|string) : Promise<TypedOperationResult<ProductWithClassificationName>> => {
    const login = await http.login()
    if (!login) return unAuthenticated
    // https://kiwitcms.readthedocs.io/en/latest/modules/tcms.rpc.api.product.html#module-tcms.rpc.api.product
    const op:TypedOperationResult<ProductWithClassificationName> = prepareStatus('createProduct')

    if (typeof classification === 'string') {
        if (classification.trim().length > 64) {
            return updateOpError(op, 'Classification name is too long (max 64 characters)')
        }
        if (classification.trim().length === 0) {
            return updateOpError(op, 'Classification name is required')
        }
    }

    // https://kiwitcms.readthedocs.io/en/latest/modules/tcms.rpc.api.classification.html#module-tcms.rpc.api.classification
    const classificationId = await determineClassificationId(classification, op)
    if (classificationId === null) return op

    const productProps: Partial<Product> = {
        name,
        description,
        classification: classificationId
    }
    const newProduct = await http.create<Product>('Product', productProps)
    .catch( e => {
        console.error('Failed to create product', e)
        updateOpError(op, 'Failed to create product: ' + (e.message || 'Unknown error'))
        return null
    } )
    if (!newProduct) return op

    const pwcn = await djangoProduct(newProduct)
    console.debug('Created Product', pwcn)
    updateOpSuccess(op, 'Product created successfully')
    op.data = pwcn
    return op
}

export const getList = async () : Promise<TypedOperationResult<ProductWithClassificationName[]>> => {
    const login = await http.login()
    if (!login) return unAuthenticated
    
    const op = { id : 'getProductList', status: false, message: '', statusType: 'blank' } as TypedOperationResult<ProductWithClassificationName[]>
    await http.searchEntity<Product>('Product', {})
    .then(
        async djlist => {
            op.data = await Promise.all(
                djlist.map( dj => djangoProduct(dj) )
            )
            updateOpSuccess(op, 'Product list retrieved successfully')
        },
        err => updateOpError(op, 'Failed to get product list: ' + (err.message || 'Unknown error'))
    )
    return op
}

export const fetchList = async (searchParams? : Partial<Product>) : Promise<ProductWithClassificationName[]> => {
    const filter = searchParams || {}
    const pl = await http.searchEntity<Product>('Product', filter)
    .then(
        djlist => Promise.all( djlist.map( dj => djangoProduct(dj) ) ),
        err => {
            console.error('Failed to fetch product list', err)
            return []
        }
    )
    return pl
}

export const fetch = async (productId: number) : Promise<ProductWithClassificationName|null> => {
    const p =  await http.getEntity<Product>('Product', productId)
    .then( async product => {
        if (!product) return null
        console.debug('Fetched Product raw', product)
        const pwcn = await djangoProduct(product)
        return pwcn
    })
    .catch( e => null )
    return p
}

export const updateProduct = async (productId: number, name:string, description:string, classification: number|string, scriptPrefix:string) : Promise<TypedOperationResult<ProductWithClassificationName>> => {
    const login = await http.login()
    if (!login) return unAuthenticated

    const op = prepareStatus('updateProduct') as TypedOperationResult<ProductWithClassificationName>

    // https://kiwitcms.readthedocs.io/en/latest/modules/tcms.rpc.api.classification.html#module-tcms.rpc.api.classification
    const classificationId = await determineClassificationId(classification, op)
    if (classificationId === null) return op
    const updates = {
        name,
        description,
        classification: classificationId,
        script_prefix: scriptPrefix
    }
    console.debug('Updating Product', productId, updates)

    const updatedProduct = await http.update('Product', productId, 'product_id', updates)
    .catch( e => {
        console.error('Failed to update product', e)
        updateOpError(op, 'Failed to update product: ' + (e.message || 'Unknown error'))
        return null
    } )
    if (!updatedProduct) return op
    // console.debug('Updated Product raw', updatedProduct)

    // const dbc = 
    updateOpSuccess(op, 'Product updated successfully')
    // op.data = true?
    return op
}



export const fetchClassifications = async () : Promise<Classification[]> => {
    const classifications = await http.search('Classification', {})
    .then( djlist => djlist.map( (dj: DjangoEntity) => dj.values as Classification ) )
    .catch( e => [] )
    // console.debug('Product Classifications', classifications)
    return classifications
}

export const getProductVersions = async (productId: number) : Promise<TypedOperationResult<Version[]>> => {
    const login = await http.login()
    if (!login) return unAuthenticated
    
    const op = prepareStatus('getProductVersions') as TypedOperationResult<Version[]>
    
    const versions = await http.search('Version', {product: productId}, false)
    .then( djlist => {
        const versionList = djlist.map( (dj: DjangoEntity) => dj.values as Version )
        updateOpSuccess(op, 'Product versions retrieved successfully')
        op.data = versionList
        return versionList
    })
    .catch( e => {
        const message = e.message ?? 'Failed to fetch product versions'
        updateOpError(op, message)
        return []
    })
    
    return op
}

export const fetchProductVersions = async (productId: number) : Promise<Version[]> => {
    const versions = await http.searchEntity<Version>('Version', {product: productId}, false)
    .catch( e => {
        console.error('Failed to fetch product versions', e)
        return []
    } )
    return versions
}

export const createVersion = async (value: string, productId: number) : Promise<TypedOperationResult<Version>> => {
    const login = await http.login()
    if (!login) return unAuthenticated
    
    const op = prepareStatus('createVersion') as TypedOperationResult<Version>
    
    const versionProps = {
        value,
        product: productId
    }
    
    const newVersion = await http.callDjango('Version.create', {values: versionProps})
    .then( result => {
        const version = result.values as Version
        console.debug('Created Version', version)
        updateOpSuccess(op, 'Version created successfully')
        op.data = version
        return version
    })
    .catch( e => {
        console.error('Failed to create version', e)
        updateOpError(op, 'Failed to create version: ' + (e.message || 'Unknown error'))
        return null
    })
    
    return op
}
