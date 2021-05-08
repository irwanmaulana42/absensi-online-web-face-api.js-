const classes = ['irwan', 'amy', 'bernadette', 'howard', 'leonard', 'penny', 'raj', 'sheldon', 'stuart', ]
    // 'amy', 'bernadette', 'howard', 'leonard', 'penny', 'raj', 'sheldon', 'stuart', 
function getFaceImageUri(className, idx) {
    return `${className}/${className}${idx}.png`
}

function getFaceImageUriNew(className, imageName) {
    return `${className}/${imageName}`
}

function renderFaceImageSelectList(selectListId, onChange, initialValue) {
    const indices = [1, 2, 3, 4, 5]

    function renderChildren(select) {
        classes.forEach(className => {
            const optgroup = document.createElement('optgroup')
            optgroup.label = className
            select.appendChild(optgroup)
            indices.forEach(imageIdx =>
                renderOption(
                    optgroup,
                    `${className} ${imageIdx}`,
                    getFaceImageUri(className, imageIdx)
                )
            )
        })
    }

    renderSelectList(
        selectListId,
        onChange,
        getFaceImageUri(initialValue.className, initialValue.imageIdx),
        renderChildren
    )
}

// fetch first image of each class and compute their descriptors
async function createBbtFaceMatcher(numImagesForTraining = 1) {
    const maxDescriptorDistance = 0.7

    let names = await getAllNames().catch(err => err);
    const labeledFaceDescriptors = await Promise.all(names.map(
        async className => {
            const descriptors = []
            className.images.forEach(async(item) => {
                const img = await faceapi.fetchImage(getFaceImageUriNew(className.classes, item))
                descriptors.push(await faceapi.computeFaceDescriptor(img))
            })

            return new faceapi.LabeledFaceDescriptors(
                className.classes,
                descriptors
            )
        }
    ))

    return new faceapi.FaceMatcher(labeledFaceDescriptors, maxDescriptorDistance)
}

async function getAllNames() {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: window.location.origin + '/getAllNames',
            type: 'POST',
            dataType: 'json',
            success: function(res) {
                console.log(res)
                resolve(res);
            },
            error: function(err) {
                console.log(err);
                reject(err);
            }
        })
    });
}