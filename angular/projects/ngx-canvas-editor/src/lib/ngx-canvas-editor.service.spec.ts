import { TestBed } from '@angular/core/testing'

import { NgxCanvasEditorService } from './ngx-canvas-editor.service'

describe('NgxCanvasEditorService', () => {
    let service: NgxCanvasEditorService

    beforeEach(() => {
        TestBed.configureTestingModule({})
        service = TestBed.inject(NgxCanvasEditorService)
    })

    it('should be created', () => {
        expect(service).toBeTruthy()
    })
})
