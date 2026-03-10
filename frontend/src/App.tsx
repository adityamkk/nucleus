// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.tsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App

import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        // Adjust the URL if your backend port is different
        const response = await axios.get('http://localhost:5000/');
        setMessage(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setMessage('Failed to connect to backend.');
      }
    };

    fetchMessage();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Fullstack App with TypeScript</h1>
        <p>Backend Message: {message}</p>
      </header>
    </div>
  );
}

export default App;

