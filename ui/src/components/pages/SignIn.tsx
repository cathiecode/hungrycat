import { useCallback } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import { useRecoilState } from "recoil";
import { login } from "../../api";
import { apiKeyState } from "../../atoms";
import Button from "../ui/Button";
import TextInput from "../ui/TextInput";

type Inputs = {
  token: string;
};

export default function SignIn() {
  const { register, handleSubmit } = useForm<Inputs>();
  const navigate = useNavigate();

  const [_, setApiKey] = useRecoilState(apiKeyState);

  const onSubmit = useCallback(
    (data: Inputs) => {
      toast.promise(login(data.token), {
        loading: "Validating your token...",
        success: (apiKey) => {
          setApiKey(apiKey);
          navigate("/");
          return `Welcome to HungryCat!`;
        },
        error: (error: Error) => {
          return error.message;
        },
      });
      login(data.token)
        .then((result) => {
          setApiKey(result);
        })
        .catch((error) => {});
    },
    [navigate]
  );

  return (
    <div className="text-center">
      <h1 className="mx-auto my-10 text-4xl">HungryCat UI</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <TextInput type="password" {...register("token")} />
        </div>
        <div className="mt-4">
          <Button mod="primary">Continue</Button>
        </div>
      </form>
    </div>
  );
}
