export default function CDropdown({ options, value, onChange }) {
    return (
        <select value={value} onChange={e => onChange(e.target.value)}>
            {options.map(option => (
                <option key={option} value={option}>{option}</option>
            ))}
        </select>
        
    );
}