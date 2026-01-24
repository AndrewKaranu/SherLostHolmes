import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: 'calc(100vh - 80px)',
      padding: '2rem'
    }}>
      <SignIn 
        appearance={{
          elements: {
            rootBox: {
              width: '100%',
              maxWidth: '400px'
            }
          }
        }}
      />
    </div>
  );
}
