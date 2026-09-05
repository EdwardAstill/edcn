import { Quiz } from "../../registry/quiz/components/Quiz";
import { runQuizContract } from "./quiz-contract";

runQuizContract((props) => <Quiz {...props} />);
