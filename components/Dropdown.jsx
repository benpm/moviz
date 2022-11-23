export default function CDropdown({ options, optionTitles, value, onChange, label }) {
    return (
        <div className="m-1">
            <label className="text-slate-100 p-1">{label}</label>
            <select value={value} onChange={e => onChange(e.target.value)}>
                {options.map((option, i) => (
                    <option key={option} value={option}>{optionTitles[option]}</option>
                ))}
            </select>
        </div>
    );
}