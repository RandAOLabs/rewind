import { useParams } from 'react-router-dom'
import './History.css'

function History() {
  const { arnsname } = useParams<{ arnsname: string }>()

  return (
    <div className="history">
      <h1>History</h1>
      {arnsname ? (
        <div>
          <h2>ARNS Name: {arnsname}</h2>
          <p>Viewing history for {arnsname}</p>
        </div>
      ) : (
        <p>No ARNS name provided</p>
      )}
    </div>
  )
}

export default History
