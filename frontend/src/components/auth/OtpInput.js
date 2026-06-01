"use client";

import React, { useRef, useEffect } from 'react';

export default function OtpInput({ length = 6, value = "", onChange }) {
  const inputRefs = useRef([]);

  // Create an array of values based on the string value
  const otpArray = Array.from({ length }, (_, i) => value[i] || "");

  const handleChange = (e, index) => {
    const val = e.target.value;
    if (/[^0-9]/.test(val)) return; // Only allow digits

    const newOtpArray = [...otpArray];
    newOtpArray[index] = val.substring(val.length - 1); // Get last char if multiple
    
    const newString = newOtpArray.join("");
    onChange(newString);

    // Focus next
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!otpArray[index] && index > 0) {
        // If current is empty, move back and clear the previous one
        inputRefs.current[index - 1]?.focus();
        const newOtpArray = [...otpArray];
        newOtpArray[index - 1] = "";
        onChange(newOtpArray.join(""));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length);
    if (pastedData) {
      const newOtpArray = [...otpArray];
      for (let i = 0; i < pastedData.length; i++) {
        newOtpArray[i] = pastedData[i];
      }
      onChange(newOtpArray.join(""));
      
      const focusIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-between w-full">
      {otpArray.map((data, index) => (
        <input
          key={index}
          type="text"
          inputMode="numeric"
          maxLength={1}
          ref={(ref) => inputRefs.current[index] = ref}
          value={data}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className="w-full aspect-square max-w-[3.5rem] text-center text-2xl font-black rounded-xl bg-brand-surface/50 border border-black/5 focus:bg-white focus:border-brand-text focus:ring-2 focus:ring-brand-text/20 outline-none transition-all"
        />
      ))}
    </div>
  );
}
