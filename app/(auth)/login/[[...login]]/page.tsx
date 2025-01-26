import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <SignIn 
         appearance={{
          elements: {
            formButtonPrimary: {
              fontSize: 14,
              fontFamily: 'var(--font-instrument-serif)',
              textTransform: 'none',
              backgroundColor: '#181818',
              '&:hover, &:focus, &:active': {
                backgroundColor: '#181818',
              },
            },
          },
        }}
        />
      </div>
  );
}