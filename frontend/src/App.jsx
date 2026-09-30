import AppRouter from './router/index.jsx'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NetworkStatus from './components/NetworkStatus/NetworkStatus.jsx';


const App = () => {
  return (
    <>
      <NetworkStatus />
      <AppRouter />
      <ToastContainer
        position='top-right'
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        theme='colored'
      />
    </>
  )
}

export default App
