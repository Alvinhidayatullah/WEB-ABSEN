import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('RuangHadir_Session');
  const path = request.nextUrl.pathname;
  
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    let payloadBase64 = sessionCookie.value.split('.')[1];
    // Convert base64url to base64
    payloadBase64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(payloadBase64));
    
    // ASP.NET Core by default uses full URI schema for claim types
    const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload.role;

    // RBAC Routing Check
    if (path.startsWith('/admin') && role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/403', request.url));
    }
    if (path.startsWith('/kepsek') && role !== 'KEPALA_SEKOLAH') {
      return NextResponse.redirect(new URL('/403', request.url));
    }
    if (path.startsWith('/teacher') && role !== 'GURU') {
      return NextResponse.redirect(new URL('/403', request.url));
    }
  } catch (e) {
    // Jika JWT rusak / tidak bisa didecode
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/kepsek/:path*', '/teacher/:path*'],
};
