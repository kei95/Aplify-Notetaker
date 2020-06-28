import React, { useState } from "react";
import { API, graphqlOperation } from "aws-amplify";
import { withAuthenticator } from "aws-amplify-react";

import { createNote } from "./graphql/mutations";

function App() {
  const [notes] = useState([]);
  const [note, setNote] = useState({});

  const handleAddNote = (e) => {
    console.log(e);
    e.preventDefault();
    API.graphql(graphqlOperation(createNote, { input: note }));
  };

  return (
    <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
      <h1 className="code f2-1">Amplify Notetaker</h1>
      <form action="mb3" onSubmit={(e) => handleAddNote(e)}>
        <input
          className="pa2 f4"
          placeholder="Write your note"
          onChange={(e) => setNote({ note: e.target.value })}
        />
        <button className="pa2 f4" type="submit">
          Add Note
        </button>
      </form>
      <div>
        {notes.map((item) => (
          <div key={item.id} className="flex items-center">
            <li className="list pa1 f3">{item.note}</li>
            <button className="bg-transparent bn f4">
              <span>&times;</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default withAuthenticator(App, { includeGreetings: true });
