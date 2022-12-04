import '../styles/globals.css'
import { useEffect } from 'react'

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    document.title = "Moviz";
  }, []);
  return <Component {...pageProps} />
}

export default MyApp
