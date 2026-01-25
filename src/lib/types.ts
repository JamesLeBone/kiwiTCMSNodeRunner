// Explicit i/o types file

// Selecting products and their categories for credential types
export type CategorySelectionOption = {
    productId: number
    productName: string
    categories: {
        id: number
        name: string
    }[]
}
