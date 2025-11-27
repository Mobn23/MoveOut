/**
 * A front end js module.
 * @author mo bn
 */

// console.log("drop zone config works");
function initDropzoneWithCategoryForm(dropzoneElementId, submitButtonId, sendingAPIDataURL ,redirectUrl) {
    const dropzoneElement = document.querySelector(dropzoneElementId);
    if (!dropzoneElement) {
        console.error("Dropzone element not found:", dropzoneElementId);
        return;
    }

    let dropzone;

    // Check if Dropzone is already attached to this element
    if (Dropzone.instances.filter(dz => dz.element === dropzoneElement).length > 0) {
        dropzone = Dropzone.instances.find(dz => dz.element === dropzoneElement);
    } else {
        // Initialize new Dropzone
        dropzone = new Dropzone(dropzoneElement, {
            url: sendingAPIDataURL,
            acceptedFiles: "image/*,audio/*,text/plain",
            maxFilesize: 5, // MB
            dictDefaultMessage: "Drop files here or click to upload (Max 5 MB)",
            autoProcessQueue: false,
            init: function() {
                this.on("success", function(file, response) {
                    console.log("File uploaded successfully:", response);
                });
            }
        });
    }

    // Handle the 'Finalize box?' button click event
    document.getElementById(submitButtonId).addEventListener("click", function(event) {
        event.preventDefault();

        if (dropzone.getQueuedFiles().length === 0 && dropzone.getUploadingFiles().length === 0) {
            window.location.href = redirectUrl;
        } else {
            dropzone.on("queuecomplete", function() {
                window.location.href = redirectUrl;
            });
        }
    });
}

function triggerFileUpload(type) {
    const inputId = type === 'text' ? 'textUpload' : type === 'audio' ? 'audioUpload' : 'imageUpload';
    document.getElementById(inputId).click();
}

function handleFileUpload(input, type, dropZoneElementId) {
    const file = input.files[0];
    if (file) {
        const dropzone = Dropzone.forElement(dropZoneElementId);
        dropzone.addFile(file);
    }
    input.value = ''; // Reset input for future uploads
}
