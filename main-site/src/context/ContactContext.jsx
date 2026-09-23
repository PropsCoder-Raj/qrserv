import { createContext, useContext } from 'react'

const contactDetails = {
  email: 'quickratingservice@gmail.com',
  mobileNumber: '+91-9529234799',
  mobileHref: 'tel:+919529234799',
  emailHref: 'mailto:quickratingservice@gmail.com',
}

const ContactContext = createContext(contactDetails)

export function ContactProvider({ children }) {
  return (
    <ContactContext.Provider value={contactDetails}>
      {children}
    </ContactContext.Provider>
  )
}

export function useContact() {
  return useContext(ContactContext)
}
