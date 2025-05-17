import { ComponentFixture, TestBed } from '@angular/core/testing'

import { NgxCanvasEditorComponent } from './ngx-canvas-editor.component'

describe('NgxCanvasEditorComponent', () => {
    let component: NgxCanvasEditorComponent
    let fixture: ComponentFixture<NgxCanvasEditorComponent>

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NgxCanvasEditorComponent]
        })
            .compileComponents()

        fixture = TestBed.createComponent(NgxCanvasEditorComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })
})
