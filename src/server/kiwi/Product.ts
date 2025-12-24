'use server'
/*

*/
import {
    http,
    methods,
    unAuthenticated
} from './Kiwi'
import { updateOpError, updateOpSuccess, TypedOperationResult, StatusOperation, prepareStatus } from '@lib/Operation'
import { BasicRecord, DjangoEntity } from './Django'
import { update } from '@server/lib/Credentials'

export type Product = {
    id: number,
    name: string,
    description: string,
    classification: number
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

const destermineClassificationId = async (classification: number|string) : Promise<number|null> => {
    if (typeof classification === 'number') return classification
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
        return null
    } )
    return createClassification
}

export const create = async (name: string, description: string, classification: number|string) : Promise<TypedOperationResult<ProductWithClassificationName>> => {
    const login = await http.login()
    if (!login) return unAuthenticated

    // https://kiwitcms.readthedocs.io/en/latest/modules/tcms.rpc.api.classification.html#module-tcms.rpc.api.classification
    const classificationId = await destermineClassificationId(classification)
    if (classificationId === null) {
        const opFail = prepareStatus('createClassification') as TypedOperationResult<ProductWithClassificationName>
        updateOpError(opFail, 'Failed to create new classification')
        return opFail
    }

    // https://kiwitcms.readthedocs.io/en/latest/modules/tcms.rpc.api.product.html#module-tcms.rpc.api.product
    const op:TypedOperationResult<ProductWithClassificationName> = prepareStatus('createProduct')
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
    .then( djlist => Promise.all(
        djlist.map( product => djangoProduct(product) ) 
    ))
    .catch( e => null )
    if (!pl) return []
    
    return pl
}

export const fetch = async (productId: number) : Promise<ProductWithClassificationName|null> => {
    const p =  await http.getEntity<Product>('Product', productId)
    .then( async product => {
        if (!product) return null
        const pwcn = await djangoProduct(product)
        return pwcn
    })
    .catch( e => null )
    return p
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
