import React, { useRef, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppContext } from '../../context/auth_context'
export default function ProtectedRoute({ children }) {
	const { isSignedIn, loading } = useAppContext()
	const hasRedirectedRef = useRef(false)
	// 🚫 Prevent rapid re-redirects to /login
	useEffect(() => {
		if (!isSignedIn && !loading) {
			if (!hasRedirectedRef.current) {
				hasRedirectedRef.current = true
				console.log("[ProtectedRoute] User not signed in, will redirect to /login")
			}
		} else if (isSignedIn) {
			// Reset guard when user signs back in
			hasRedirectedRef.current = false
		}
	}, [isSignedIn, loading])

	// ✅ Show loading state while auth resolves
	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
				<div className="text-center">
					<div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white mx-auto mb-4"></div>
					<p className="text-white text-lg font-medium">Authenticating...</p>
				</div>
			</div>
		)
	}
	// ✅ Redirect to login only if confirmed not signed in
	if (!isSignedIn) {
		console.log("[ProtectedRoute] Redirecting to /login — user not authenticated")
		return <Navigate to="/login" replace />
	}
	// ✅ User is signed in and loaded, render protected content
	return children
}