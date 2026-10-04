# Test accounts (local development only)

Create them once with:

```powershell
.\dev seed
```

The seed is safe to re-run and refuses to run unless `APP_ENV=development`. These credentials are
public and must never be used outside a local machine.

## Log in

| Tab on the login page | Email               | Password       | Name         | Lands on     |
| --------------------- | ------------------- | -------------- | ------------ | ------------ |
| **Parent**            | `priya@example.com` | `Parent@12345` | Priya Sharma | `/dashboard` |
| **Parent**            | `rahul@example.com` | `Parent@12345` | Rahul Verma  | `/dashboard` |
| **Teacher / Admin**   | `admin@example.com` | `Admin@12345`  | Rekha Menon  | `/admin`     |

Admin school: Greenwood Public School.

## Try these on the Register page

Use a brand-new email, e.g. `newparent@example.com` / `Welcome@123` / `Test Parent`.

## Things worth checking

| Try this                                                              | Expected result                                   |
| --------------------------------------------------------------------- | ------------------------------------------------- |
| Log in as Priya                                                       | "Welcome, Priya" page                             |
| Reload the page while logged in                                       | Still logged in                                   |
| Click **Log out**                                                     | Back to the login page                            |
| Log in with `priya@example.com` and a wrong password                  | Red "Incorrect email or password"                 |
| Register with `priya@example.com`                                     | Red "An account with this email already exists"   |
| Register with a password shorter than 8 characters                    | Red "at least 8 characters" (no request is sent)  |
| Log in as admin on the **Parent** tab                                 | Works, and still lands on `/admin`                |
| While logged in as a parent, open `http://localhost:5173/admin`       | Redirected to `/dashboard`                        |
| While logged out, open `http://localhost:5173/dashboard`              | Redirected to the login page                      |

## Cleaning up

To remove everything you registered while testing, run this in MySQL Workbench:

```sql
DELETE FROM learncurve.users WHERE email NOT IN
  ('priya@example.com', 'rahul@example.com', 'admin@example.com');
```
