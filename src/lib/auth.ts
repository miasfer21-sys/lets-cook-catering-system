import type { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db, rows } from './db';
import { verifyPassword } from './password';
export const authOptions: NextAuthOptions = {
  session: {strategy:'jwt', maxAge:3600},
  providers:[Credentials({name:'Fictional demonstration staff', credentials:{email:{label:'Email',type:'email'},password:{label:'Demo password',type:'password'}}, async authorize(c) {
    if(!c?.email || !c.password || c.password.length>256) return null;
    const [staff]=await rows(db,'SELECT * FROM staff_member WHERE email=$1 AND active=true',c.email);
    return staff && verifyPassword(c.password,staff.password_hash) ? {id:staff.id,name:staff.name,email:staff.email} : null;
  }})],
  callbacks:{async jwt({token,user}) { if(user) token.sub=user.id; return token; }, async session({session,token}) { (session as any).staffId=token.sub; return session; }},
};
