import { FormEvent, useId, useReducer, useState } from "react";
import Input from "../components/Input";
import { FaGoogle } from "react-icons/fa";
import { NavLink, Navigate } from "react-router-dom";

import { ASYNC_STATE, IUser } from "../types/global";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "../hooks/user.slice";
import axios, { AxiosError } from "axios";
import { RootState } from "../hooks/store";
import ImageUploader from "../components/ImageUploader";

class SignUpError {
  constructor(
    public type: SignUpActions | undefined,
    public message: string,
    public status: boolean
  ) {}
}

type ISignUpUser = Omit<IUser, "_id" | "profile"> & {
  profile: null | File;
  password: string;
  confirmPassword: string;
  error: SignUpError;
};

enum SignUpActions {
  SET_NAME,
  SET_EMAIL,
  SET_PROFILE,
  SET_PASSWORD,
  SET_CONFIRM_PASSWORD,
  SET_ERROR,
}

const initial: ISignUpUser = {
  name: "",
  email: "",
  profile: null,
  password: "",
  confirmPassword: "",
  error: { type: undefined, message: "", status: false },
};

const reducer = (
  state: ISignUpUser,
  action: {
    type: SignUpActions;
    payload: string | SignUpError | File;
  }
) => {
  const { type } = action;
  switch (type) {
    case SignUpActions.SET_NAME: {
      const { payload } = action;
      if (typeof payload !== "string") return state;

      const name = payload;
      return { ...state, name };
    }

    case SignUpActions.SET_EMAIL: {
      const { payload } = action;
      if (typeof payload !== "string") return state;

      const email = payload;
      return { ...state, email };
    }
    case SignUpActions.SET_PROFILE: {
      const { payload } = action;
      const profile = payload;
      if (profile instanceof File) return { ...state, profile };
      return state;
    }
    case SignUpActions.SET_PASSWORD: {
      const { payload } = action;
      if (typeof payload !== "string") return state;

      const password = payload;
      return { ...state, password };
    }

    case SignUpActions.SET_CONFIRM_PASSWORD: {
      const { payload } = action;
      if (typeof payload !== "string") return state;

      const confirmPassword = payload;
      return { ...state, confirmPassword };
    }

    case SignUpActions.SET_ERROR: {
      const { payload } = action;
      const error = payload;
      if (error instanceof SignUpError) return { ...state, error };

      return state;
    }

    default:
      throw new Error("Unimplemented method");
  }
};

const SignUp = () => {
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();

  const [state, dispatch] = useReducer(reducer, initial);
  const userDispatch = useDispatch();
  const userData = useSelector((state: RootState) => state.user);

  const [asyncState, setAsyncState] = useState(ASYNC_STATE.IDEL);
  if (userData.loggedIn) return <Navigate to="/" />;
  if (asyncState === ASYNC_STATE.REDIRECT) return <Navigate to="/sign-in" />;

  const signUpHandler = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { name, email, profile, password, confirmPassword } = state;
    console.log("🚀 ~ signUpHandler ~ state:", state);

    if (name.trim().length < 7)
      return dispatch({
        type: SignUpActions.SET_ERROR,
        payload: new SignUpError(
          SignUpActions.SET_NAME,
          "User full name can't be less that 7 characters!",
          true
        ),
      });
    if (!/\b\D+\w*@gmail.com/.test(email) || !email)
      return dispatch({
        type: SignUpActions.SET_ERROR,

        payload: new SignUpError(
          SignUpActions.SET_EMAIL,
          "Please provide valid email!",
          true
        ),
      });

    if (!profile)
      return dispatch({
        type: SignUpActions.SET_ERROR,

        payload: new SignUpError(
          SignUpActions.SET_PROFILE,
          "Please provide profile!",
          true
        ),
      });
    if (password.trim().length < 6)
      return dispatch({
        type: SignUpActions.SET_ERROR,
        payload: new SignUpError(
          SignUpActions.SET_PASSWORD,
          "Please provide strong password greater than 5 symbols!",
          true
        ),
      });
    if (password !== confirmPassword)
      return dispatch({
        type: SignUpActions.SET_ERROR,

        payload: new SignUpError(
          SignUpActions.SET_CONFIRM_PASSWORD,
          "Please confirm your password",
          true
        ),
      });

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("profile", profile);
    formData.append("password", password);

    console.log("🚀 ~ signUpHandler ~ formData:", formData);

    try {
      setAsyncState(ASYNC_STATE.LOADING);
      const response = await axios.post(
        "http://localhost:5050/api/v1/users/sign-up",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const {
        data: { user: userData },
        token,
      } = response.data as { data: { user: IUser }; token: string };
      localStorage.setItem("token", token);
      userDispatch(setUser(userData));
      setAsyncState(ASYNC_STATE.REDIRECT);
    } catch (error) {
      if (error instanceof AxiosError) console.warn(error.response?.data);
      setAsyncState(ASYNC_STATE.ERROR);
    }
  };

  return (
    <div className="h-screen grid place-items-center">
      <section className="min-w-[16rem] max-w-[30rem]">
        <h1
          className="font-bold text-3xl mb-4 text-center text-slate-700"
          style={{ lineHeight: "150%" }}
        >
          Supercharge Your
          <span className="text-red-400"> Productivity </span>
          with COLI - Sign Up Now!
        </h1>
        <form
          className="flex flex-col gap-3 h-[55vh] overflow-x-hidden overflow-y-scroll scroll-bar-none px-3"
          onSubmit={signUpHandler}
        >
          <p className="text-slate-500 text-sm font-semibold">
            If you already have an account,{" "}
            <NavLink className="text-slate-600" to="/sign-in">
              Sign In
            </NavLink>
          </p>

          <Input
            id={nameId}
            type="text"
            labelText={
              state.error.status && state.error.type === SignUpActions.SET_NAME
                ? state.error.message
                : "Full name"
            }
            color={
              state.error.status && state.error.type === SignUpActions.SET_NAME
                ? "red"
                : ""
            }
            borderBottomColor={
              state.error.status && state.error.type === SignUpActions.SET_NAME
                ? "border-b-red-400"
                : ""
            }
            initial={state.name}
            onInputChangeHandler={(value: string) => {
              dispatch({
                type: SignUpActions.SET_ERROR,
                payload: new SignUpError(undefined, "", false),
              });
              dispatch({ type: SignUpActions.SET_NAME, payload: value });
            }}
          />
          <Input
            id={emailId}
            type="email"
            labelText={
              state.error.status && state.error.type === SignUpActions.SET_EMAIL
                ? state.error.message
                : "Email"
            }
            color={
              state.error.status && state.error.type === SignUpActions.SET_EMAIL
                ? "red"
                : ""
            }
            borderBottomColor={
              state.error.status && state.error.type === SignUpActions.SET_EMAIL
                ? "border-b-red-400"
                : ""
            }
            initial={state.email}
            onInputChangeHandler={(value: string) => {
              dispatch({
                type: SignUpActions.SET_ERROR,
                payload: new SignUpError(undefined, "", false),
              });
              dispatch({ type: SignUpActions.SET_EMAIL, payload: value });
            }}
          />

          <Input
            id={passwordId}
            type="password"
            labelText={
              state.error.status &&
              state.error.type === SignUpActions.SET_PASSWORD
                ? state.error.message
                : "Password"
            }
            color={
              state.error.status &&
              state.error.type === SignUpActions.SET_PASSWORD
                ? "red"
                : ""
            }
            borderBottomColor={
              state.error.status &&
              state.error.type === SignUpActions.SET_PASSWORD
                ? "border-b-red-400"
                : ""
            }
            initial={state.password}
            onInputChangeHandler={(value: string) => {
              dispatch({
                type: SignUpActions.SET_ERROR,
                payload: new SignUpError(undefined, "", false),
              });
              dispatch({ type: SignUpActions.SET_PASSWORD, payload: value });
            }}
          />
          <Input
            id={confirmPasswordId}
            type="password"
            labelText={
              state.error.status &&
              state.error.type === SignUpActions.SET_CONFIRM_PASSWORD
                ? state.error.message
                : "Confrim Password"
            }
            color={
              state.error.status &&
              state.error.type === SignUpActions.SET_CONFIRM_PASSWORD
                ? "red"
                : ""
            }
            borderBottomColor={
              state.error.status &&
              state.error.type === SignUpActions.SET_CONFIRM_PASSWORD
                ? "border-b-red-400"
                : ""
            }
            initial={state.confirmPassword}
            onInputChangeHandler={(value: string) => {
              dispatch({
                type: SignUpActions.SET_ERROR,
                payload: new SignUpError(undefined, "", false),
              });
              dispatch({
                type: SignUpActions.SET_CONFIRM_PASSWORD,
                payload: value,
              });
            }}
          />

          <ImageUploader
            initial={state.profile}
            id="Upload Profile"
            labelText={
              state.error.status &&
              state.error.type === SignUpActions.SET_PROFILE
                ? state.error.message
                : "User Profile[Optional]"
            }
            imageUploadHandler={(file) => {
              dispatch({
                type: SignUpActions.SET_ERROR,
                payload: new SignUpError(undefined, "", false),
              });
              dispatch({ type: SignUpActions.SET_PROFILE, payload: file });
            }}
          />

          <div className="mt-4">
            <button
              disabled={asyncState === ASYNC_STATE.LOADING && true}
              className={`block w-full py-2 rounded-sm font-semibold ${
                asyncState !== ASYNC_STATE.LOADING
                  ? "bg-slate-700 text-white hover:bg-slate-700/95 active:bg-slate-700"
                  : " bg-gray-100 text-slate-700"
              } tracking-wide transition-all duration-200 `}
            >
              {asyncState !== ASYNC_STATE.LOADING ? "Sign Up" : "Waiting..."}
            </button>
          </div>
        </form>

        <p className="text-center my-2 font-semibold">Or</p>
        <div className="px-3">
          <button
            disabled={asyncState === ASYNC_STATE.LOADING && true}
            className="flex items-center justify-center w-full mb-4 ring-1 ring-slate-600 py-2  rounded-sm font-semibold tracking-wide transition-all duration-200 hover:opacity-90 active:opacity-100 "
          >
            {asyncState !== ASYNC_STATE.LOADING ? (
              <>
                {" "}
                <span className="text-xl text-orange-500">
                  <FaGoogle />
                </span>
                <span className="ml-4 text-slate-700">Sign In with Google</span>
              </>
            ) : (
              "Waiting..."
            )}
          </button>
        </div>
      </section>
    </div>
  );
};

export default SignUp;
