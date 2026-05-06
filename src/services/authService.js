import { auth } from "../firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateEmail
} from "firebase/auth";


export const signup = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const login = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const resetPassword = (email) => {
  return sendPasswordResetEmail(auth, email)
}

export const changePassword = (user,newPassword) => {
  return updatePassword(user,newPassword)
}

export const changeEmail = (user,newEmail) => {
  return updateEmail(user,newEmail)
}

export const logout = ()=>{
  return signOut(auth);
}


