import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-dark text-light py-3 mt-auto">
      <Container>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <p className="mb-0">&copy; {currentYear} Car Exchange Module. All rights reserved.</p>
          </div>
          <div>
            <a href="#" className="text-light me-3">Privacy Policy</a>
            <a href="#" className="text-light me-3">Terms of Service</a>
            <a href="#" className="text-light">Contact Us</a>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
