'use client'

import { PuffLoader } from 'react-spinners'

export default function Loader() {
  return (
    <div className="fixed-loader">
      <PuffLoader color="#8b5cf6" size={90} />
    </div>
  )
}