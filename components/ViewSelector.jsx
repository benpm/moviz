


export default function CViewSelector({ }) {
    //Create a rounded rectange with a border
    return (
        <div className="">
            <div className="text-center">Select View</div>
            <div className="items-center bg-straw text-darkest" style={{
                border: '0px solid black', borderRadius: '15px', flex: 1, height: '50%',
                boxSizing: "border-box", boxShadow:"inset 3px 4px 10px rgba(0,0,0,0.99)"
            }}>
                <div className="flex flex-row justify-center items-center" style={{ height: '100%', boxSizing: "border-box" }}>
                    <div className="text-center hover:bg-sandy-brown" style={{ width: '33%'}}>
                        Quality
                    </div>
                    <div className="w-px h-full bg-black grow-0"></div>
                    <div className="text-center" style={{ width: '33%' }}>
                        Movie Economy
                    </div>
                    <div className="w-px h-full bg-black grow-0"></div>
                    <div className="text-center" style={{ width: '33%' }}>
                        Bang for the Buck
                    </div>
                </div>
            </div>
        </div>
    );
}