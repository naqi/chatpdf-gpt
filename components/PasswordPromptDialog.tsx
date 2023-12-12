"use client";

import React, { useState } from 'react';

const PasswordPromptDialog = ({ onSubmit }) => {
  const [password, setPassword] = useState('');
  const [passwordIncorrect, setPasswordIncorrect] = useState(false)
  const [loading, setLoading] = useState(false);

  const handleSubmit =async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      const request = await fetch(`/api`, {
        body: JSON.stringify({password}),
        headers: {"Content-Type": "application/json"},
        method: "post",
      });

      if (request.status !== 200)
        return setPasswordIncorrect(true), setLoading(false);
      else window.location.reload();
  };


    return (
      <div className="h-ful  container grid w-2 items-center gap-1 pb-1 pt-8">
        <form onSubmit={handleSubmit}>
          <label htmlFor="password">Password:</label>
          <input
            style={{borderWidth: 1, padding: 4}}
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="border-solid border-2 mt-8 outline-1 p-4" type="submit">Submit</button>
        </form>
      </div>
    );

}

  export default PasswordPromptDialog;
