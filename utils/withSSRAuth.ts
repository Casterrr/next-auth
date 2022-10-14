
// import decode from 'jwt-decode'
// import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next"
// import { destroyCookie, parseCookies } from "nookies"
// import { AuthTokenError } from '../services/AuthTokenError'
// import { validateUserPermissions } from "./validateUserPermissions"


// type SSRAuthOptions = {
//   permissions?: string[]
//   roles?: string[]
// }

// // Validate the guest
// export function withSSRAuth<P>(fn: GetServerSideProps<P>/* , options?: SSRAuthOptions */): GetServerSideProps {
//     return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {
//       const cookies = parseCookies(ctx) 
//       const token = cookies['nextauth.token']
//       //console.log(ctx.req.cookies)
      
//       // If token exists, redirect to dashboard
//       if (!token['nextauth.token']) {
//         return {
//           redirect: {
//             destination: '/',
//             permanent: false
//           }
          
//         }
//       }     

//       // if (options) {
//       //   const user = decode<{ permissions: string[], roles: string[] }>(token)
//       //   const { permissions, roles } = options
        
//       //   const validPermissions = validateUserPermissions({
//       //     user,
//       //     permissions,
//       //     roles
//       //   })
        
//       //   if (!validPermissions) {
//       //     return {
//       //       redirect: {
//       //         destination: '/dashboard',
//       //         permanent: false,
//       //       }
//       //     }
//       //   }
//       // }

//       // const user = decode(token)

//       // console.log(user)

//       try {
//         return await fn(ctx)      
//       } 
//       catch (err) {
//           if (err instanceof AuthTokenError) {            
//             destroyCookie(ctx, 'nextauth.token')
//             destroyCookie(ctx, 'nextauth.refreshToken')
            
//             // aqui é servidor, não funciona o router.push
//             // por isso não chamei a função signOut()
            
//             return {
//               redirect: {
//                 destination: '/',
//                 permanent: false,
//               }
//             }        
//           }
//       }
//     }
// }


// // This redirect is being made by serverside
// // It could be made by client-side, that is, inside the useEffect.
// // Inside the component, but it would show the page and redirect right after.
import decode from 'jwt-decode'
import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next"
import { destroyCookie, parseCookies } from "nookies"
import { AuthTokenError } from "../services/AuthTokenError"
import { validateUserPermissions } from './validateUserPermissions'

type withSSRAuthOptions = {
  permissions?: string[]
  roles?: string[]
}

// Validate the guest
export function withSSRAuth<P>(fn: GetServerSideProps<P>, options?: withSSRAuthOptions): GetServerSideProps {
    return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {
      const cookies = parseCookies(ctx) 
      const token = cookies['nextauth.token']
      //console.log(ctx.req.cookies)
      
      // If token exists, redirect to dashboard
      if (!token) {
        return {
          redirect: {
            destination: '/',
            permanent: false
          }
          
        }
      }


      if (options) {
        const user = decode<{ permissions: string[], roles: string[] }>(token)
        const { permissions, roles } = options
        
        const validPermissions = validateUserPermissions({
          user,
          permissions,
          roles
        })
        
        if (!validPermissions) {
          return {
            redirect: {
              destination: '/dashboard',
              permanent: false,
            }
          }
        }
      }

      try {
        return await fn(ctx)      
      } 
      catch (err) {
          if (err instanceof AuthTokenError) {            
            destroyCookie(ctx, 'nextauth.token')
            destroyCookie(ctx, 'nextauth.refreshToken')
            
            // aqui é servidor, não funciona o router.push
            // por isso não chamei a função signOut()
            
            return {
              redirect: {
                destination: '/',
                permanent: false,
              }
            }        
          }
      }     
    }
}

// This redirect is being made by serverside
// It could be made by client-side, that is, inside the useEffect.
// Inside the component, but it would show the page and redirect right after.
