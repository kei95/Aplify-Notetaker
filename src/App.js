import React, { useState, useEffect } from "react";
import { API, graphqlOperation, Auth } from "aws-amplify";
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
  useEffect(() => {
    async function getNotes() {
      const fetchedNotes = await API.graphql(graphqlOperation(listNotes));
      setNotes(
        fetchedNotes.data.listNotes.items.sort(
          (noteA, noteB) =>
            new Date(noteB.createdAt) - new Date(noteA.createdAt)
        )
      );
    }

    const createNoteListener = API.graphql(
      graphqlOperation(onCreateNote, { owner: Auth.user.username })
    ).subscribe({
      next: (noteData) => {
        const newNote = noteData.value.data.onCreateNote;
        setNotes((prevNotes) => {
          const updatedNotes = [newNote, ...prevNotes];
          return updatedNotes;
        });
      },
    });

    const deleteListener = API.graphql(
      graphqlOperation(onDeleteNote, { owner: Auth.user.username })
    ).subscribe({
      next: (noteData) => {
        const deletedNote = noteData.value.data.onDeleteNote;
        setNotes((prevNotes) => {
          const updatedNotes = prevNotes.filter(
            (note) => note.id !== deletedNote.id
          );
          return updatedNotes;
        });
      },
    });

    const updateListener = API.graphql(
      graphqlOperation(onUpdateNote, { owner: Auth.user.username })
    ).subscribe({
      next: (noteDate) => {
        const updatedNote = noteDate.value.data.onUpdateNote;
        setNotes((prevNotes) => {
          const index = prevNotes.findIndex(
            (note) => note.id === updatedNote.id
          );
          const updatedNotes = [
            ...prevNotes.slice(0, index),
            updatedNote,
            ...prevNotes.slice(index + 1),
          ];
          return updatedNotes;
        });
      },
    });

    getNotes();
    return () => {
      createNoteListener.unsubscribe();
      deleteListener.unsubscribe();
      updateListener.unsubscribe();
    };
  }, []);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (note.length > 0) {
      if (hasExistingNote()) {
        handleUpdateNote();
        return;
      }
      await API.graphql(graphqlOperation(createNote, { input: { note } }));
      setNote("");
    }
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
