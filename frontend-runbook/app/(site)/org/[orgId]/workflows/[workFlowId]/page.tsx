import { DatabaseProvider } from "@/app/context/DatabaseContext";
import WorkflowBuilder from "./WorkflowBuilder";

export default function WorkflowPage() {
    return (
        <DatabaseProvider>
            <div className="h-full w-full">
                <WorkflowBuilder />
            </div>
        </DatabaseProvider>
    );
}
