import joplin from 'api';
import { MenuItemLocation, ToolbarButtonLocation, SettingItemType} from 'api/types';
import { Project, TodoistApi } from "@doist/todoist-api-typescript"


joplin.plugins.register({
	onStart: async function() {
		
		const dialogs = joplin.views.dialogs;

		// Create a "new todoist task" dialog to collect input from user
		const taskDialog = await dialogs.create('myDialog3');

		// Add CSS styling to the "new todoist task" dialog
		await joplin.views.dialogs.addScript(taskDialog,'./taskDialog.css');
		

		// eslint-disable-next-line no-console
		console.info('Joplin to Todist plugin v 0.2 started');
		console.info('Registering Todoist API');

		// Create a section in settings called "Todoist to Joplin"
		await joplin.settings.registerSection('ttmSection', {
            label: 'Joplin to Todoist',
            iconName: 'fas fa-list',
        });

		// Add a input box in the "Todoist to Joplin" section in settings
		// so the user can enter their Todoist API key
		await joplin.settings.registerSettings({
            'ttmKeySetting': {
                value: '',
                type: SettingItemType.String,
                section: 'ttmSection',
                public: true,
                secure: false,
                label: 'Todoist API token',
            },
        });
		
		
		await joplin.commands.register({
			name: 'newTodoistTask',
			label: 'New Todoist Task',
			iconName: 'fas fa-clipboard-check',
			execute: async () => {
				const key = await joplin.settings.value('ttmKeySetting');
				const api = new TodoistApi(key);
                if (!key) 
				{
                    console.error('ToDoist API token not found.');
					alert("No API token found for Todoist. Please enter a token in the settings.")
                } 
				else 
				{
					//Get selected text
					var selectedText = (await joplin.commands.execute('selectedText') as string);

					var note = await joplin.workspace.selectedNote();
					console.dir(note);

					await dialogs.setHtml(taskDialog, `
					<form name="taskInfo">
					<b>Task Title</b> <input type="text" name="taskname" value="`+ selectedText +`" />
					<br />
					<b>Task Due</b> <input type="text" name="due" placeholder="(ex: 'Today', 'Friday', 'Every day')"/>
					<br />
					<b>Task Description</b>
					<textarea name="desc" placeholder="Description for your task. A link to the currently selected Joplin note will be appended here."></textarea>
				  	</form>
					`);

					const taskDialogResults = await dialogs.open(taskDialog);
					console.dir(taskDialogResults);

					var taskdata = {
						content: taskDialogResults.formData.taskInfo.taskname,
						dueString: taskDialogResults.formData.taskInfo.due,
						description: taskDialogResults.formData.taskInfo.desc + "\n" + "Joplin Note: [" + note.title + "](joplin://x-callback-url/openNote?id=" + note.id + ")" ,
						dueLang: "en",
						priority: 4
					};

					console.info(taskdata);

					api.addTask(taskdata).then((task) => {
						console.log(task);
						console.log(task.url);
						updateNoteBody("- [" + task.content + "](" + task.url + ")");
						
					}).catch((error) => console.log(error))
				}			
			},
		});

		// Add the first command to the note toolbar
		await joplin.views.toolbarButtons.create('newTodoistTaskBTTN', 'newTodoistTask', ToolbarButtonLocation.NoteToolbar);
	},
});

export async function updateNoteBody(newBodyStr: string) 
{
    //console.info("Update note: " + noteId);
	
	
	await joplin.commands.execute('textSelectAll');
	const current = await joplin.commands.execute("selectedText");
	await joplin.commands.execute("replaceSelection", current + "\n\n" + newBodyStr);
	  
}

