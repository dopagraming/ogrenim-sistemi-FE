import { Mail, Phone, Github } from "lucide-react";
import logo from "../assets/logo-dark.png";

function Footer() {
  return (
    <footer
      className={
        "bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 transition-colors duration-200"
      }
    >
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center">
              <img src={logo} alt="logo" className="w-40" />
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              A platform that makes appointment scheduling between teachers and
              students effortless.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
              Links
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
              Contact
            </h3>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Mail className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                blog@abdelrahmanzourob.com
              </li>
              <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Phone className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                +90 (501) 349-5530
              </li>
              <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Github className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                <a
                  href="#"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Abdelrahman Zourob. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
