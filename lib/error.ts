import { AxiosError, AxiosResponse } from "axios";
import { toast } from "sonner";

const processError = (error: AxiosError, cb?: CallableFunction) => {
  let msg = "";
  let isProdEnv = process.env.NODE_ENV === "production";

  if ((error?.response?.data as Record<string, any>)?.message) {
    msg = (error?.response?.data as Record<string, any>)?.message;

    if (!cb) {
      toast.error(msg);
    } else {
      cb(msg);
    }
    return msg;
  } else if (
    (error?.response?.data as Record<string, any>)?.detail &&
    (error?.response?.data as Record<string, any>)?.detail instanceof Array
  ) {
    (error?.response?.data as Record<string, any>)?.detail?.map(
      (det: { msg: string; loc: string | any[] }) => {
        msg = det?.msg;
        let field = det?.loc?.slice(-1);
        msg = `${field}:${msg}`;
        if (msg) {
          if (!cb) {
            toast.error(msg);
          } else {
            cb(msg);
          }
          return msg;
        }
        return "incomplete or incorrect details";
      },
    );
  } else if ((error?.response?.data as Record<string, any>)?.detail) {
    msg = (error?.response?.data as Record<string, any>)?.detail;

    if (msg == "Invalid Credentials") {
      window.location.href = "/sign-in";
    }

    if (cb) {
      cb(msg);
    } else {
      toast.error(msg);
    }
    return msg;
  } else if (error?.response?.status === 422) {
    toast.message("incomplete or incorrect details");
    return "incomplete or incorrect details";
  } else if (error?.response?.status! >= 500) {
    toast.error("We could not connect to the server");
    return "We could not connect to the server";
  } else {
    if (!isProdEnv) {
      console.error({ error });
    }
    toast.error("An Error Occurred");
  }
};

export default processError;
