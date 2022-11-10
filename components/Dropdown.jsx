export default function CDropdown({ options, value, onChange, label }) {
    return (
        <div className="m-1">
            <label className="text-slate-100 p-1">{label}</label>
            <select value={value} onChange={e => onChange(e.target.value)}>
                {options.map(option => (
                    <option key={option} value={option}>{option}</option>
                ))}
            </select>
        </div>
    );
}