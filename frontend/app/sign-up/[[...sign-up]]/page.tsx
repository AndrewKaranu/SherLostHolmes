import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: 'calc(100vh - 80px)',
      padding: '2rem'
    }}>
      <SignUp 
        appearance={{
          elements: {
            rootBox: {
              width: '100%',
              maxWidth: '400px'
            }
          }
        }}
        unsafeMetadata={{
          studentIdRequired: true
        }}
      />
    </div>
  );
}
