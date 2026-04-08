import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/react'
import { useAppContext } from '../../context/auth_context'

export default function ProtectedRoute({ children }) {
	// 🔑 PRIMARY: Use Clerk's auth state
	const { isLoaded, isSignedIn } = useAuth()
	
	// 📊 SECONDARY: Use auth_context to track profile load
	const { isAuthenticated } = useAppContext()

	// ⏳ Loading State: While Clerk is checking OR Clerk says signed in but we haven't loaded profile yet
	if (!isLoaded || (isSignedIn && !isAuthenticated)) {
		console.log(
			`[ProtectedRoute] Loading... isLoaded=${isLoaded}, isSignedIn=${isSignedIn}, isAuthenticated=${isAuthenticated}`
		)
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
				<div className="text-center">
					<div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white mx-auto mb-4"></div>
					<p className="text-white text-lg font-medium">Authenticating...</p>
				</div>
			</div>
		)
	}

	// 🚫 Redirect: Clerk confirms NOT signed in
	if (!isSignedIn) {
		console.log("[ProtectedRoute] Redirecting to /login — Clerk isSignedIn=false")
		return <Navigate to="/login" replace />
	}

	// ✅ Allowed: Clerk says signed in AND profile is loaded
	console.log("[ProtectedRoute] ✅ Rendering protected content — user is authenticated")
	return children
}