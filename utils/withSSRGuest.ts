import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next"
import { parseCookies } from "nookies"

// Validate the guest
export function withSSRGuest<P>(fn: GetServerSideProps<P>): GetServerSideProps {
    return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {
        const cookies = parseCookies(ctx) 
        //console.log(ctx.req.cookies)
        
        // If token exists, redirect to dashboard
        if (cookies['nextauth.token']) {
          return {
            redirect: {
              destination: '/dashboard',
              permanent: false
            }
            
          }
        }     

        return await fn(ctx)        
    }
}

// This redirect is being made by serverside
// It could be made by client-side, that is, inside the useEffect.
// Inside the component, but it would show the page and redirect right after.
