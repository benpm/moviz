import { useEffect, useState } from "react";
import useGlobalState from "../hooks/useGlobalState";
import Fuse from "fuse.js"

export default function CSearchBar ({data}) {
    const [searchFilter, setSearchFilter] = useGlobalState(s => [s.searchFilter, s.setSearchFilter]);
    const [nameMap, setNameMap] = useState(null);

    useEffect(() => {
        setNameMap(new Fuse(data, {
            keys: ["name"],
            includeScore: true,
            threshold: 0.05
        }));
    }, [data]);

    const handleSearch = (query) => {
        if (!nameMap) return;

        if (query.length > 0) {
            setSearchFilter(new Set(nameMap.search(query).map(r => r.item.idx)));
        } else {
            setSearchFilter(new Set());
        }
    };

    return (
        <>
            <div className="flex h-full place-items-center text-white relative mr-2">
                <input type="text"
                    className="bg-dark text-light p-1 rounded w-full focus:bg-darkest focus:text-white"
                    placeholder="Search..."
                    onChange={e => handleSearch(e.target.value)}></input>
                
                <p className="p-1 w-12 absolute text-right right-0 text-light font-bold">{searchFilter.size > 0 ? `${searchFilter.size}` : ""}</p>
            </div>
        </>
    );
}