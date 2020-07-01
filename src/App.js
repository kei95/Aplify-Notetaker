import React, { useState, useEffect } from "react";
import { API, graphqlOperation } from "aws-amplify";
import { withAuthenticator } from "aws-amplify-react";

import { createNote, deleteNote, updateNote } from "./graphql/mutations";
import { listNotes } from "./graphql/queries";
import {
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
} from "./graphql/subscriptions";

function App() {
  const [notes, setNotes] = useState([]);
  const [note, setNote] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [isInitialFetchDone, setIsInitialFetchDone] = useState(false);

  useEffect(() => {
    async function getNotes() {
      if (!isInitialFetchDone) {
        const fetchedNotes = await API.graphql(graphqlOperation(listNotes));
        console.log(fetchedNotes);
        setNotes(
          fetchedNotes.data.listNotes.items.sort(
            (noteA, noteB) =>
              new Date(noteB.createdAt) - new Date(noteA.createdAt)
          )
        );
        setIsInitialFetchDone(true);
      }
    }

    const createNoteListener = API.graphql(
      graphqlOperation(onCreateNote)
    ).subscribe({
      next: (noteData) => {
        const newNote = noteData.value.data.onCreateNote;
        const prevNotes = notes.filter((note) => note.id !== newNote.id);
        const updatedNotes = [newNote, ...prevNotes];
        setNotes(updatedNotes);
        getNotes();
      },
    });

    const deleteListener = API.graphql(
      graphqlOperation(onDeleteNote)
    ).subscribe({
      next: (noteData) => {
        getNotes();
        const deletedNote = noteData.value.data.onDeleteNote;
        const updatedNotes = notes.filter((note) => note.id !== deletedNote.id);
        setNotes(updatedNotes);
        getNotes();
      },
    });

    const updateListener = API.graphql(
      graphqlOperation(onUpdateNote)
    ).subscribe({
      next: (noteDate) => {
        getNotes();
        const updatedNote = noteDate.value.data.onUpdateNote;
        const index = notes.findIndex((note) => note.id === updatedNote.id);
        const updatedNotes = [
          ...notes.slice(0, index),
          updatedNote,
          ...notes.slice(index + 1),
        ];
        setNotes(updatedNotes);
        getNotes();
      },
    });

    getNotes();
    return () => {
      createNoteListener.unsubscribe();
      deleteListener.unsubscribe();
      updateListener.unsubscribe();
    };
  }, [isInitialFetchDone, notes]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (hasExistingNote()) {
      handleUpdateNote();
      return;
    }
    await API.graphql(graphqlOperation(createNote, { input: { note } }));
    setNote("");
  };

  const handleUpdateNote = async () => {
    const input = { id: selectedId, note };
    await API.graphql(graphqlOperation(updateNote, { input }));
    setNote("");
    setSelectedId("");
  };

  const hasExistingNote = () => {
    if (selectedId) {
      return notes.findIndex((note) => note.id === selectedId) > -1;
    }
    return false;
  };

  const handleDeleteBtn = async (id) => {
    const input = { id };
    await API.graphql(graphqlOperation(deleteNote, { input }));
  };

  const handleSetNote = (item) => {
    const { id, note } = item;
    setNote(note);
    setSelectedId(id);
  };

  return (
    <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
      <h1 className="code f2-1">Amplify Notetaker</h1>
      <form action="mb3" onSubmit={(e) => handleAddNote(e)}>
        <input
          className="pa2 f4"
          placeholder="Write your note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button className="pa2 f4" type="submit">
          {selectedId ? "Update Note" : "Add Note"}
        </button>
      </form>
      <div>
        {notes.map((item) => {
          const color = selectedId === item.id ? "#d0cece" : "#000000";
          return (
            <div key={item.id} className="flex items-center">
              <li
                style={{ color }}
                onClick={() => handleSetNote(item)}
                className="list pa1 f3"
              >
                {item.note}
              </li>
              {selectedId !== item.id && (
                <button
                  style={{ color }}
                  className="bg-transparent bn f4"
                  onClick={() => handleDeleteBtn(item.id)}
                >
                  <span>&times;</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default withAuthenticator(App, { includeGreetings: true });
