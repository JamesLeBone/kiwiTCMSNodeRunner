
export function ListOpt({value, label, disabled}: {value: string|number, label: string|number, disabled?: boolean}) {
    return <option value={value} disabled={disabled}>{label}</option>
}
export function OptionGroup({label, children}: {label: string, children: React.ReactNode}) {
    return <optgroup label={label}>
        {children}
    </optgroup>
}

type selectionValue = string|number
export interface selectionOption {
    value: selectionValue,
    label: selectionValue,
    disabled?: boolean
}

export type SelectionProps = {
    name: string
    value?: selectionValue
    options?: Record<string, selectionValue|selectionValue[]>
    required?: boolean
    onChange: (val: selectionValue) => void
}
export function Selection({name, value, required, options, onChange}: SelectionProps) {
    const setValue = (e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)
    const opts = options ? Object.entries(options).map(([key, val], idx) => {
        if (Array.isArray(val)) {
            return <OptionGroup key={idx} label={key}>
                {val.map((v, i) => <ListOpt key={i} value={v} label={v} />)}
            </OptionGroup>
        }
        return <ListOpt key={idx} value={key} label={val} />
    }) : []
    
    return <select name={name} value={value} onChange={setValue} required={required}>
        {opts}
    </select>
}

export type SelectionDetailedProps = {
    name: string
    value?: selectionValue
    required?: boolean
    options: selectionOption[]
    onChange?: (val: selectionValue) => void
}
export function SelectionDetailed({name, value, options, required, onChange}: SelectionDetailedProps) {
    const setValue = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (!onChange) return
        onChange(e.target.value)
    }
    const opts = options.map((opt, idx) => {
        return <ListOpt key={idx} value={opt.value} label={opt.label} disabled={opt.disabled ?? false} />
    })
    
    return <select name={name} value={value} onChange={setValue} required={required}>
        {opts}
    </select>
}

export function SelectBoolean({name, value, onChange}: {name: string, value?: boolean, onChange: (val: boolean) => void}) {
    const setValue = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value === 'true' ? true : false
        onChange(val)
    }
    return <select name={name} value={value ? 'true' : 'false'} onChange={setValue}>
        <ListOpt value="true" label="True" />
        <ListOpt value="false" label="False" />
    </select>
}

export const CheckboxBoolean = ({name, value, onChange}: {name: string, value?: boolean, onChange: (val: boolean) => void}) => {
    const toggleValue = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.checked)
    }
    return <input type="checkbox" name={name} checked={value ?? false} onChange={toggleValue} />
}
