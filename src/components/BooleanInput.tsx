
declare type BooleanProps = {
    name?: string
    checked?: boolean
    setVal: (value: boolean) => void
    [key: string]: any
}
export default function BooleanInput({name, checked, setVal, ...props} : BooleanProps) {
    const handleClick = () => {
        const newValue = !checked
        setVal(newValue)
    }

    return <span className='Boolean-Wrap' onClick={() => handleClick()}>
        <input type='hidden' name={name} value={checked ? 'true' : 'false'} />
        <span className='slider'></span>
        <div>
            <span>On</span>
            <span>Off</span>
        </div>
    </span>
}
