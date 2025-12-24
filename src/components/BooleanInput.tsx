
type BooleanProps = {
    name?: string
    checked?: boolean
    setVal: (value: boolean) => void // This is required for state management.
    values?: [string, string]
    [key: string]: any
}
export default function BooleanInput({name, checked, setVal, values = ['On', 'Off'], ...props} : BooleanProps) {
    const handleClick = () => {
        const newValue = !checked
        if (setVal) setVal(newValue)
    }

    return <span className='Boolean-Wrap' onClick={() => handleClick()}>
        <input type='hidden' name={name} value={checked ? 'true' : 'false'} />
        <span className='slider'></span>
        <div>
            <span>{values[0]}</span>
            <span>{values[1]}</span>
        </div>
    </span>
}
