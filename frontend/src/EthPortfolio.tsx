import React, { useState } from 'react'

const API_BASE_URL = 'http://localhost:3001/api'
interface Token {
  symbol: string
  balance: string
}

interface BalanceResponse {
  tokens: Token[]
  success: boolean
}

export const EthPortfolio = () => {
  const [address, setAddress] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [balanceData, setBalanceData] = useState<BalanceResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchBalance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.trim()) {
      setError('Please enter an Ethereum address')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(`${API_BASE_URL}/balance?address=${address}`)
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        setError('Failed to fetch balance data')
        return
      }

      setBalanceData(data)
    } catch (err) {
      let errorMessage = 'An error occurred while fetching the balance'
      if (err instanceof Error) {
        errorMessage = err.message
      }
      setError(errorMessage)
      console.error('Error fetching balance:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-center">Ethereum Portfolio</h1>
      <form onSubmit={fetchBalance} className="mb-6">
        <div className="mb-4">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Ethereum Address
          </label>
          <input
            type="text"
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="cursor-pointer w-full bg-black/90 text-white py-2 px-4 rounded-md hover:bg-black/100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-300"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Loading...
            </span>
          ) : (
            'See Portfolio'
          )}
        </button>
      </form>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {balanceData && balanceData.tokens && balanceData.tokens.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-md">
          <h2 className="text-xl font-semibold mb-3">Token Balances</h2>
          <div className="divide-y divide-gray-200">
            {balanceData.tokens.map((token, index) => (
              <div key={index} className="flex justify-between items-center py-3">
                <div className="flex items-center">
                  <span className="font-medium text-gray-900">{token.symbol}</span>
                </div>
                <span
                  className={`text-gray-700 ${
                    parseFloat(token.balance) === 0 ? 'text-gray-400' : ''
                  }`}
                >
                  {token.balance}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {balanceData && (!balanceData.tokens || balanceData.tokens.length === 0) && (
        <div className="text-center p-4 bg-gray-50 rounded-md">
          <p className="text-gray-500">No tokens found for this address.</p>
        </div>
      )}
    </div>
  )
}
