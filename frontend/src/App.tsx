import { useState, useEffect } from "react";

const buttons = [
  "7","8","9","/",
  "4","5","6","*",
  "1","2","3","-",
  "0",".","(",")",
  "+","^","pi","e",
  "sin","cos","tan","log","ln"
];

export default function App() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<{expr:string,result:string}[]>([]);
  const [loading, setLoading] = useState(false);

  function append(value:string){
    if(["sin","cos","tan","log","ln"].includes(value)){
      setInput(prev => prev + value + "(");
    } else {
      setInput(prev => prev + value);
    }
  }

  function clear(){
    setInput("");
  }

  async function submit(){
    if(!input.trim()) return;

    console.log(input);

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/evaluate",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ payload: input })
      });

      const data = await res.json();

      const value = typeof data === "number" ? data.toString() : String(data);

      setHistory(prev => [...prev,{expr:input,result:value}]);
      setInput("");
    } catch(err) {
      setHistory(prev => [...prev,{expr:input,result:`Error contacting server ${err}`}]);
    }

    setLoading(false);
  }

  useEffect(()=>{
    function handleKey(e:KeyboardEvent){
      if(e.key === "Enter"){
        submit();
        return;
      }

      const allowed = "0123456789.+-*/^()";

      if(allowed.includes(e.key)){
        setInput(prev=>prev+e.key);
      }

      if(e.key === "Backspace"){
        setInput(prev=>prev.slice(0,-1));
      }
    }

    window.addEventListener("keydown",handleKey);
    return ()=>window.removeEventListener("keydown",handleKey);
  },[input]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white shadow-xl rounded-2xl p-6 w-[360px]">

        <div className="mb-4">
          <div className="border rounded-lg p-3 text-right text-xl min-h-[40px]">
            {input}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-3">
          {buttons.map(b => (
            <button
              key={b}
              onClick={()=>append(b)}
              className="bg-gray-200 hover:bg-gray-300 rounded-lg p-2"
            >
              {b}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={clear}
            className="flex-1 bg-red-400 hover:bg-red-500 text-white rounded-lg p-2"
          >
            Clear
          </button>

          <button
            onClick={submit}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-2"
          >
            Enter
          </button>
        </div>

        <div className="border-t pt-3 max-h-[300px] overflow-y-auto">
          {history.slice().reverse().map((h,i)=>(
            <div key={i} className="mb-2">
              <div className="text-left text-gray-700">{h.expr}</div>
              <div className="text-right font-semibold">{h.result}</div>
            </div>
          ))}

          {loading && (
            <div className="text-right text-gray-400">Computing...</div>
          )}
        </div>

      </div>
    </div>
  );
}
