import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import {
  NavigationMenu,
  NavigationMenuList,
} from "./components/ui/navigation-menu";
// import './App.css'

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="container mx-auto px-4 py-8">
      <NavigationMenu>
        <NavigationMenuList>hi</NavigationMenuList>
        <NavigationMenuList>hi</NavigationMenuList>
      </NavigationMenu>
      <div className="flex justify-center items-center gap-8 mb-8">
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1 className="text-4xl font-bold text-center mb-8">Vite + React</h1>
      <div className="card text-center">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
          onClick={() => setCount((count) => count + 1)}
        >
          count is {count}
        </button>
        <p className="mb-4">
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs text-center text-gray-600">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  );
}

export default App;
