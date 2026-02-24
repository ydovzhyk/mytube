'use client'

import { PuffLoader } from 'react-spinners'

export default function Loader({ size = 90 }) {
  return (
    <div className="fixed-loader">
      <PuffLoader color="#8b5cf6" size={size} />
    </div>
  )
}