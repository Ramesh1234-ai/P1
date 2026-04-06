import { createContext, useContext, useState } from "react";
import { useUser } from "@clerk/react";
const AuthContext = createContext();
export function AuthProvider({ children }) {
  const { user: clerkUser, isSignedIn } = useUser();
  const [manualUser, setManualUser] = useState(null);
  // decide active user
  const user = clerkUser || manualUser;
  const login = (email) => {
    setManualUser({ email });
  };
  const logout = () => {
    setManualUser(null);
  };
  return (
    <AuthContext.Provider value={{ user, isSignedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export default AuthContext;