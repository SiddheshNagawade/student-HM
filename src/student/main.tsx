import { createRoot } from 'react-dom/client'
import '../index.css'
import App from './App'
import './sync'
import { Guard } from '../ds/guard'
createRoot(document.getElementById('root')!).render(<Guard><App /></Guard>)
