import { type NextPage } from "next";
import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { api } from "../utils/api";

const Home: NextPage = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <main className="flex flex-col items-center pt-4">Loading...</main>;
  }

  return (
    <main className="flex flex-col items-center">
      <h1 className="pt-4 text-3xl">Guestbook</h1>
      <p>
        Tutorial for <code>create-t3-app</code>
      </p>
      <div className="pt-10">
        <div>
          {session ? (
            <>
              <p className="mb-4 text-center">Hi {session.user?.name}</p>

              <button
                type="button"
                className="mx-auto block rounded-md bg-neutral-800 py-3 px-6 text-center hover:bg-neutral-700"
                onClick={() => {
                  signOut().catch(console.error);
                }}
              >
                Logout
              </button>
              <div className="pt-6">
                <Form />
              </div>
            </>
          ) : (
            <button
              type="button"
              className="mx-auto block rounded-md bg-neutral-800 py-3 px-6 text-center hover:bg-neutral-700"
              onClick={() => {
                signIn("twitter").catch(console.error);
              }}
            >
              Login with Twitter
            </button>
          )}
          <div className="pt-10">
            <GuestbookEntries />
          </div>
        </div>
      </div>
    </main>
  );
};

const GuestbookEntries = () => {
  const { data: guestbookEntries, isLoading } = api.guestBook.getAll.useQuery();

  if (isLoading) {
    return <div>Fetching messages...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {guestbookEntries?.map((entry, i) => {
        return (
          <div key={i}>
            <p>{entry.message}</p>
            <span className="text-sm">- {entry.name}</span>
          </div>
        );
      })}
    </div>
  );
};

const Form = () => {
  const [message, setMessage] = useState("");
  const { data: session, status } = useSession();

  const utils = api.useContext();
  const postMessage = api.guestBook.postMessage.useMutation({
    // When mutate is called:
    onMutate: async (newEntry) => {
      // Cancel any outgoing refetches
      await utils.guestBook.getAll.cancel();
      // Optimistically update to the new value
      utils.guestBook.getAll.setData(undefined, (prev) => {
        return [newEntry, ...(prev ?? [])];
      });
    },
    // Always refetch after error or success:
    onSettled: async () => {
      await utils.guestBook.getAll.invalidate();
    },
  });

  if (status !== "authenticated") {
    return null;
  }

  return (
    <form
      className="flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        postMessage.mutate({
          name: session.user?.name as string,
          message,
        });
        setMessage("");
      }}
    >
      <input
        type="text"
        className="rounded-md border-2 border-zinc-800 bg-neutral-900 px-4 py-2 focus:outline-none"
        placeholder="Your message..."
        minLength={2}
        maxLength={100}
        value={message}
        onChange={(event) => {
          setMessage(event.target.value);
        }}
      />
      <button
        type="submit"
        className="rounded-md border-2 border-zinc-800 p-2 focus:outline-none"
      >
        Submit
      </button>
    </form>
  );
};

export default Home;
