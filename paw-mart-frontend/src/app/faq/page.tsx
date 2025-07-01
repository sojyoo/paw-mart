"use client";
import React from 'react';
import Link from 'next/link';

export default function FAQPage() {
  const faqs = [
    {
      question: "How does the screening process work?",
      answer: "Our screening process involves filling out a detailed form about your experience with pets, living conditions, household members, and time commitment. You'll also need to provide ID documents and proof of residence. Our team reviews your application and may contact you for additional information. The process typically takes 2-3 business days."
    },
    {
      question: "What documents do I need to provide?",
      answer: "You'll need to upload a photo of your government-issued ID (driver's license, passport, etc.) and proof of residence (utility bill, lease agreement, etc.). These documents help us verify your identity and ensure you're eligible to adopt a pet."
    },
    {
      question: "How much do the dogs cost?",
      answer: "Adoption fees vary depending on the dog's breed, age, and any special care requirements. The fee typically ranges from ₱5,000 to ₱25,000. This helps cover the costs of care, vaccinations, and other expenses we've incurred while caring for the dog."
    },
    {
      question: "What's included in the adoption fee?",
      answer: "The adoption fee includes the dog's vaccinations, health check, microchipping, and basic care during their time with us. Some dogs may also come with basic supplies like a collar, leash, or food. We'll provide you with a detailed breakdown of what's included."
    },
    {
      question: "How long does the process take?",
      answer: "From initial screening to bringing your dog home, the process typically takes 1-2 weeks. This includes screening approval (2-3 days), meeting the dog, completing paperwork, and arranging pickup. We'll keep you updated throughout the process."
    },
    {
      question: "Can I return a dog if it doesn't work out?",
      answer: "Yes, we understand that sometimes adoptions don't work out as planned. We have a return policy that allows you to return the dog within 30 days of adoption. We'll work with you to find a better match or provide support to help the adoption succeed."
    },
    {
      question: "What support do you provide after adoption?",
      answer: "We provide ongoing support after adoption, including advice on training, behavior issues, and general care. We're available by email and phone to answer questions and help ensure a successful adoption. We also offer follow-up check-ins to see how you and your new family member are doing."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-800 mb-4">Frequently Asked Questions</h1>
          <p className="text-gray-600 text-lg">
            Find answers to common questions about adopting a dog from PawMart
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Still have questions? We're here to help!
          </p>
          <Link 
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 